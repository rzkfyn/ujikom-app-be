import User from '../../app/models/User.js';
import Profile from '../../app/models/Profile.js';
import ProfileMedia from '../../app/models/ProfileMedia.js';
import Post from '../../app/models/Post.js';
import HasFollower from '../../app/models/HasFollower.js';

export const associationsInit = () => {
  User.belongsToMany(User, { through: {
    model: HasFollower,
    paranoid: true
  }, foreignKey: 'followed_user_id', as: 'followers' });
  User.belongsToMany(User, { 
    through: {
      model: HasFollower,
      paranoid: true
    }, foreignKey: 'follower_user_id', as: 'following' });
  User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile' });
  Profile.belongsTo(User, { foreignKey: 'user_id', as: 'profile' });
  Profile.hasMany(ProfileMedia, { foreignKey: 'profile_id', as: 'profile_media' });
  ProfileMedia.belongsTo(Profile, { foreignKey: 'profile_id', as: 'profile_media' });
  User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
  Post.belongsTo(User, { foreignKey: 'user_id', as: 'posts' });
};
