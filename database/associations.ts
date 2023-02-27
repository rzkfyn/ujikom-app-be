import User from '../app/models/User.js';
import Profile from '../app/models/Profile.js';
import ProfileMedia from '../app/models/ProfileMedia.js';
import Post from '../app/models/Post.js';
import HasFollower from '../app/models/HasFollower.js';
import HasBlocker from '../app/models/HasBlocker.js';
import PostMedia from '../app/models/PostMedia.js';
import PostLike from '../app/models/PostLike.js';
import Notification from '../app/models/Notification.js';
import MentionedUserOnPost from '../app/models/MentionedUserOnPost.js';
import SavedPost from '../app/models/SavedPost.js';
import Comment from '../app/models/Comment.js';
import SharedPost from '../app/models/SharedPost.js';
import AccountSetting from '../app/models/AccountSetting.js';

export const associationsInit = () => {
  User.belongsToMany(User, { 
    through: {
      model: HasFollower,
      paranoid: true
    }, foreignKey: 'followed_user_id', as: 'followers' });
  User.belongsToMany(User, { 
    through: {
      model: HasFollower,
      paranoid: true
    }, foreignKey: 'follower_user_id', as: 'following' });
  User.belongsToMany(User, { 
    through: {
      model: HasBlocker,
      paranoid: true
    }, foreignKey: 'blocked_user_id', as: 'blocker' });
  User.belongsToMany(User, {
    through:  {
      model: HasBlocker,
      paranoid: true
    }, foreignKey: 'blocker_user_id', as: 'blocking' });
  User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile' });
  Profile.belongsTo(User, { foreignKey: 'user_id', as: 'profile' });
  User.hasOne(AccountSetting, { foreignKey: 'user_id', as: 'account_setting' });
  AccountSetting.belongsTo(User, { foreignKey: 'user_id', as: 'account_setting' });
  Profile.hasMany(ProfileMedia, { foreignKey: 'profile_id', as: 'profile_media' });
  ProfileMedia.belongsTo(Profile, { foreignKey: 'profile_id', as: 'profile' });
  User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
  Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Post.hasMany(PostMedia, { foreignKey: 'post_id', as: 'media' });
  PostMedia.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
  Post.belongsToMany(User, {
    through: {
      model: PostLike,
      paranoid: true,
    }, foreignKey: 'post_id', as: 'likers' });
  User.belongsToMany(Post, {
    through: {
      model: PostLike,
      paranoid: true
    }, foreignKey: 'user_id', as: 'liked_posts' });
  Notification.belongsTo(User, { foreignKey: 'fired_by_user_id', as: 'fired_by_user' });
  Post.belongsToMany(User, {
    through: {
      model: MentionedUserOnPost,
      paranoid: true
    }, foreignKey: 'post_id', as: 'mentioned_users'});
  User.belongsToMany(Post, {
    through: {
      model: MentionedUserOnPost,
      paranoid: true
    }, foreignKey: 'user_id', as: 'mentioned_on_posts'});
  Post.belongsToMany(User, {
    through: {
      model: SavedPost,
      paranoid: true
    }, foreignKey: 'post_id', as: 'saved_by_users' });
  User.belongsToMany(Post, {
    through: {
      model: SavedPost,
      paranoid: true
    }, foreignKey: 'user_id', as: 'saved_posts' });
  Post.hasMany(SavedPost, { foreignKey: 'post_id', as: 'saved_post_vipot' });
  SavedPost.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
  Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
  Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
  Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
  Post.belongsToMany(Post, {
    through: {
      model: SharedPost,
      paranoid: false,
    }, foreignKey: 'post_id', as: 'shared_post' });
  Post.belongsToMany(Post, {
    through: {
      model: SharedPost,
      paranoid: false,
    }, foreignKey: 'shared_post_id', as: 'shared_on_posts' });
};
