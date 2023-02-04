import { Model } from 'sequelize';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import User from '../models/User.js';
import type { 
  user as userType,
  profile as profileType,
  profileMedia as profileMediaType
} from '../types/types.js';

class UserService {
  public getUserWithProfile = async (username: string) => {
    const userData = await User.findOne({ 
      where: { username },
      attributes: [ 'name', 'id', 'username', 'email', 'createdAt' ],
      include: { 
        model: Profile,
        as: 'profile',
        attributes: [ 'bio', 'age', 'location', 'gender', 'url' ],
        include: [
          {
            model: ProfileMedia,
            as: 'profile_media',
            attributes: [ 'file_name', 'file_mime_type', 'context' ]
          }
        ]
      }
    });
    if (!userData) return false;
    const userProfile = userData.dataValues.profile.dataValues as profileType;
    const profileMedia = (userData.dataValues.profile.dataValues.profile_media as { dataValues: profileMediaType }[])
      .map(({ dataValues }) => ({ 
        dataValues: { 
          ...dataValues,
          file_name: dataValues.file_name ?? 'default.jpg',
          file_mime_type: dataValues.file_mime_type ?? 'image/jpg'
        } 
      }));
    const profile_image = profileMedia.find(({ dataValues }) => dataValues.context === 'PROFILE_IMAGE')?.dataValues;
    const cover_image = profileMedia.find(({ dataValues }) => dataValues.context === 'COVER_IMAGE')?.dataValues;
    delete userData.dataValues.profile;
    const userDataValues = userData.dataValues as userType;
    const followers = await this.getUserConnectionsInfo(username);
    const following = await this.getUserConnectionsInfo(username, 'following');

    return {
      ...userDataValues,
      profile: {
        ...userProfile,
        profile_media: {
          profile_image,
          cover_image
        }
      },
      followers,
      following
    };
  };

  public getUserConnectionsInfo = async (username: string, context = 'followers') => {
    let data;
    if (context === 'followers') {
      data = await User.findOne({ where: { username }, include: { 
        model: User,
        as: 'followers', 
        attributes: [ 'name', 'id', 'username', 'email', 'createdAt' ],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: [ 'bio', 'age', 'location', 'gender', 'url' ],
            include: [
              {
                model: ProfileMedia,
                as: 'profile_media',
                attributes: [ 'file_name', 'file_mime_type', 'context' ]
              }
            ]
          }
        ]
      } });
    } else {
      data = await User.findOne({ where: { username }, include: { 
        model: User,
        as: 'following', 
        attributes: [ 'name', 'id', 'username', 'email', 'createdAt' ],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: [ 'bio', 'age', 'location', 'gender', 'url' ],
            include: [
              {
                model: ProfileMedia,
                as: 'profile_media',
                attributes: [ 'file_name', 'file_mime_type', 'context' ]
              }
            ]
          }
        ]
      } });
    }

    const result = data?.dataValues[context].map((user: Model<any, any>) => {
      const profileMedia = (user?.dataValues?.profile?.profile_media as { dataValues: profileMediaType }[])
        .map(({ dataValues }) => ({ 
          dataValues: { 
            ...dataValues,
            file_name: dataValues.file_name ?? 'default.jpg',
            file_mime_type: dataValues.file_mime_type ?? 'image/jpg'
          }
        }));
      delete user.dataValues.profile?.dataValues?.profile_media;
      const userProfile = user.dataValues.profile?.dataValues;
      delete user.dataValues?.profile;
      const profile_image = profileMedia.find(({ dataValues }) => dataValues.context === 'PROFILE_IMAGE')?.dataValues;
      const cover_image = profileMedia.find(({ dataValues }) => dataValues.context === 'COVER_IMAGE')?.dataValues;
      delete user.dataValues?.profile;
      delete user.dataValues?.HasFollowers;
      const userDataValues = user.dataValues as userType;

      return {
        ...userDataValues,
        profile: {
          ...userProfile,
          profile_media: {
            profile_image,
            cover_image
          }
        },
      };
    });

    return result;
  };
}

export default UserService;
