import User from '../../app/models/User.js';
import Profile from '../../app/models/Profile.js';
import ProfileMedia from '../../app/models/ProfileMedia.js';

export const associationsInit = () => {
  User.belongsToMany(User, { through: 'HasFollowers', foreignKey: 'followed_user_id', as: 'followers' });
  User.belongsToMany(User, { through: 'HasFollowers', foreignKey: 'follower_user_id', as: 'following' });
  User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile' });
  Profile.belongsTo(User, { foreignKey: 'user_id', as: 'profile' });
  Profile.hasMany(ProfileMedia, { foreignKey: 'profile_id', as: 'profile_media' });
  ProfileMedia.belongsTo(Profile, { foreignKey: 'profile_id', as: 'profile_media' });
};
