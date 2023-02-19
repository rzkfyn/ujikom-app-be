import { Model } from 'sequelize';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import User from '../models/User.js';
import type { 
  UserDetail
} from '../types/types.js';

class UserService {
  public getUserDetail = async (username: string) => {
    const user = await User.findOne({ 
      where: { username },
      attributes: [ 'id', 'username', 'name', 'createdAt', 'email_verified_at' ],
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: [ 'bio', 'age', 'location', 'gender', 'url', 'date_of_birth' ],
          include: [
            {
              model: ProfileMedia,
              as: 'profile_media',
              attributes: [ 'file_name', 'file_mime_type', 'context' ]
            },
          ]
        },
        {
          model: User,
          as: 'followers',
          attributes: [ 'id', 'username', 'name', 'createdAt' ],
        },
        {
          model: User,
          as: 'following',
          attributes: [ 'id', 'username', 'name', 'createdAt' ],
        },
        {
          model: User,
          as: 'blocker',
          attributes: [ 'id', 'username', 'name', 'createdAt' ],
        },
        {
          model: User,
          as: 'blocking',
          attributes: [ 'id', 'username', 'name', 'createdAt' ],
        }
      ]
    }) as Model<UserDetail, UserDetail> | null;

    if (!user) return false;

    const result = user.toJSON() as UserDetail;
    return result;
  };

  public getUserConnectionsInfo = async (username: string, context = 'followers') => {
    const user = await User.findOne({ where: { username }, include: { 
      model: User,
      as: context, 
      attributes: [ 'id', 'username', 'name', 'createdAt' ],
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
        },
        {
          model: User,
          as: 'blocker',
          attributes: [ 'id', 'username', 'name', 'createdAt' ],
        },
        {
          model: User,
          as: 'blocking',
          attributes: [ 'id', 'username', 'name', 'createdAt' ],
        }
      ]
    } }) as unknown;

    if (!user) return false;

    const result = ((user as any)[context] as Model[]).map((user) => user.toJSON());
    return result;
  };
}

export default UserService;
