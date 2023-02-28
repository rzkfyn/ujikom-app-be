import { Model } from 'sequelize';
import AccountSetting from '../models/AccountSetting.js';
import FollowRequest from '../models/FollowRequest.js';
import HasFollower from '../models/HasFollower.js';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import User from '../models/User.js';
import UserPresence from '../models/UserPresence.js';
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
        },
        {
          model: AccountSetting,
          as: 'account_setting'
        },
        {
          model: User,
          as: 'follow_requests',
          attributes: [ 'id', 'username', 'name', 'createdAt' ]
        },
        {
          model: UserPresence,
          as: 'user_presence',
          attributes: [ 'status', 'last_seen' ]
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
        },
        {
          model: UserPresence,
          as: 'user_presence',
          attributes: [ 'status', 'last_seen' ]
        }
      ]
    } }) as unknown;

    if (!user) return false;

    const result = ((user as Model).dataValues[context] as Model[]).map((user) => user.toJSON());
    console.log(result[0]);
    return result;
  };

  public isFollowed = async (userId: number, followed_user_id: number) => {
    const hasFollower = await HasFollower.findOne({ where: { follower_user_id: userId, followed_user_id } });
    if (!hasFollower) return false;
    return true;
  };

  public isUserAccountPrivate = async (username: string) => {
    const user = await this.getUserDetail(username);
    if (!user) return false;
 
    return user.account_setting.account_visibility === 'PRIVATE';
  };

  public getMutualConnections = async (username: string) => {
    const user = await this.getUserDetail(username);
    if (!user) return false;
    const followers = await this.getUserConnectionsInfo(username, 'followers');
    const following = await this.getUserConnectionsInfo(username, 'following');

    const mutualConnections = (followers as UserDetail[]).filter((follower) => {
      return (following as UserDetail[]).some((following) => following.id === follower.id);
    });

    return mutualConnections;
  };
}

export default UserService;
