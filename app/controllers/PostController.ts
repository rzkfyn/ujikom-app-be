import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { nanoid } from 'nanoid';
import { literal, Model } from 'sequelize';
import { encode } from 'html-entities';
import Database from '../core/Database.js';
import Post from '../models/Post.js';
import PostLike from '../models/PostLike.js';
import PostMedia from '../models/PostMedia.js';
import SavedPost from '../models/SavedPost.js';
import User from '../models/User.js';
import type { 
  User as userType,
  Post as postType,
  postMedia as postMediaType
} from '../types/types.js';
import NotificationService from '../services/NotificationService.js';
import PostService from '../services/PostService.js';
import MentionedUserOnPost from '../models/MentionedUserOnPost.js';
import SharedPost from '../models/SharedPost.js';
import UserService from '../services/UserService.js';

class PostController {
  private static notificationService = new NotificationService();
  private static postService = new PostService();
  private static userService = new UserService();

  public static createPost = async (req: Request, res: Response) => {
    const { text, auth } = req.body;
    const { user: authorizedUser } = auth;

    let media = req.files?.media as UploadedFile[];
    if (!Array.isArray(media) && media) media = [media];

    if (media && media[0]) {
      for (const file of media) {
        if (file.size > (20 * 1024 * 1024)) return res.status(400).json({ status: 'Error', message: 'Max size for a file to upload is 20mb' });
        const newFileName = `${+ new Date()}${authorizedUser.username}_post_${nanoid(4)}.${file.name.split('.')[file.name.split('.').length-1]}`;
        file.name = newFileName;
      }
    }
    let postCode;
    const transaction = await Database.transaction();
    try {
      postCode = nanoid(12);
      const newPost = await Post.create({ code: postCode, text: encode(text ?? ''), user_id: authorizedUser.id, transaction }) as Model<postType, postType>;
      if (text) {
        const sanitizedText = encode(text).replace(/\r\n/g, ' ');
        const arrText = sanitizedText.split(' ');

        let mentions = arrText.filter((item: string) => item.startsWith('@') || item.split('@').length > 1);
        mentions = mentions.map((item: string) => item.split('@').length > 1 ? `@${item.split('@')[item.split('@').length - 1]}` : item);

        for (const mention of mentions) {
          const user = await User.findOne({ where: { username: mention.replace('@', '') } }) as Model<userType, userType> | null;

          if (user !== null) await MentionedUserOnPost.create({ user_id: user?.dataValues.id, post_id: newPost.dataValues.id, key: mention }, { transaction });
        }
      }

      if (media && media[0]) {
        for (const file of media) {
          await file.mv(`./public/media/images/posts/${file.name}`);
        }

        await PostMedia.bulkCreate(media.map((file) => ({
          file_name: file.name,
          file_mime_type: file.mimetype,
          post_id: newPost.dataValues.id
        })), { transaction }) as Model<postMediaType, postMediaType>[];
      }

      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(201).json({ status: 'Ok', message: 'Post created successfully', data: { post_code: postCode } });
  };

  public static getUserPosts = async (req: Request, res: Response) => {
    const { username } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    let posts;
    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      posts = await this.postService.getUserPosts(user.dataValues.id);
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully fetch user\'s posts', data: posts });
  };

  public static getPostByPostCode = async (req: Request, res: Response) => {
    const { postCode } = req.params;

    let post;
    try {
      post = await this.postService.getSinglePostByCode(postCode);
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    if (!post) return res.status(404).json({ status: 'Error', message: 'Internal server error' });

    return res.status(200).json({ status: 'Ok', message: 'successfully fetched post', data: post });
  };

  public static deletePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    const transaction = await Database.transaction();
    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType> | null;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      if (post.dataValues.user_id !== authorizedUser.id) return res.status(403).json({ status: 'Error', message: 'You don\'t have permission to delete this post' });

      await this.postService.removePost(post.dataValues.id, transaction);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Post deleted successfully' });
  };

  public static likePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    const transaction = await Database.transaction();
    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const alreadyLikedPost = await PostLike.findOne({ where: { user_id: authorizedUser.id, post_id: post.dataValues.id } });
      if (alreadyLikedPost) return res.status(400).json({ status: 'Error', message: 'You already liked this post' });
      await PostLike.create({ post_id: post.dataValues.id, user_id: authorizedUser.id }, { transaction });
      await this.notificationService.createNotification(post.dataValues.user_id, authorizedUser.id, 'POST_LIKE', post.dataValues.id, transaction);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully liked post' });
  };

  public static unLikePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    const transaction = await Database.transaction();
    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const postLike = await PostLike.findOne({ where: { user_id: authorizedUser.id, post_id: post.dataValues.id } });
      if (!postLike) return res.status(400).json({ status: 'Error', message: 'You were not liked this post' });
      await postLike.destroy({ transaction });
      await this.notificationService.removeNotification(post.dataValues.user_id, authorizedUser.id, 'POST_LIKE', post.dataValues.id, transaction);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully liked post' });
  };

  public static savePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const savedPost = await SavedPost.findOne({ where: { user_id: authorizedUser.id, post_id: post.dataValues.id } });
      if (savedPost) return res.status(400).json({ status: 'Error', message: 'You already saved this post' });
      await SavedPost.create({ user_id: authorizedUser.id, post_id: post.dataValues.id });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Post saved successfully' });
  };

  public static unSavePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const savedPost = await SavedPost.findOne({ where: { user_id: authorizedUser.id, post_id: post.dataValues.id } });
      if (!savedPost) return res.status(400).json({ status: 'Error', message: 'You were not saved this post' });
      await savedPost.destroy();
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully removed post from saved' });
  };

  public static getRandomPost = async (req: Request, res: Response) => {
    const { auth } = req.body;
    const { following } = req.query;
    const { user: authorizedUser } = auth;

    let posts;
    try {
      let where;
      if (!authorizedUser.id) {
        where = undefined;
      } else {
        if (!following) {
          where = literal(`user_id NOT IN (${authorizedUser.id})`);
        } else {
          where = literal(`user_id NOT IN (${authorizedUser.id}) AND user_id IN (
            SELECT followed_user_id FROM HasFollowers hf
            WHERE hf.follower_user_id=${authorizedUser.id}
            AND hf.deletedAt IS NULL
          )`);
        }
      }

      posts = await this.postService.getRandomPosts(where);
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully fetched posts', data: posts });
  };

  public static getSavedPosts = async (req: Request, res: Response) => {
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    let posts;
    try {
      posts = await this.postService.getSavedPosts(authorizedUser.id);
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Sucessfully fetched saved posts', data: posts });
  };

  public static sharePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { auth, text } = req.body;
    const { user: authorizedUser } = auth;

    const transaction = await Database.transaction();
    try {
      const sharedPost = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType> | null;
      if (!sharedPost) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const code = nanoid(20);
      const newPost = await Post.create({ user_id: authorizedUser.id, text, code }, { transaction }) as Model<postType, postType>;
      await SharedPost.create({ user_id: authorizedUser.id, post_id: newPost.dataValues.id, shared_post_id: sharedPost.dataValues.id, text }, { transaction });
      await this.notificationService.createNotification(sharedPost.dataValues.user_id, authorizedUser.id, 'POST_SHARE', newPost.dataValues.id, transaction);
      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully shared post' });
  };

  public static getPostById = async (req: Request, res: Response) => {
    const { postId } = req.params;

    let post;
    try {
      post = await this.postService.getSinglePostById(parseInt(postId));
    } catch(e) {
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
    return res.status(200).json({ status: 'Ok', message: 'Successfully fetched post', data: post });
  };
}

export default PostController;
