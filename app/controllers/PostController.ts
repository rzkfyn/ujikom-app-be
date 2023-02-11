import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { nanoid } from 'nanoid';
import { Model, Op } from 'sequelize';
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
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';

class PostController {
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
    const transaction = await Database.transaction();
    try {
      const postCode = nanoid(8);
      const newPost = await Post.create({ code: postCode, text, user_id: authorizedUser.id, transaction }) as Model<postType, postType>;
      
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
    return res.status(201).json({ status: 'Ok', message: 'Post created successfully' });
  };

  public static getUserPosts = async (req: Request, res: Response) => {
    const { username } = req.params;

    let posts;
    try {
      const user = await User.findOne({ where: { username } }) as Model<userType, userType>;
      if (!user) return res.status(404).json({ status: 'Error', message: 'User not found' });
      posts = await Post.findAll({ 
        where: { user_id: user.dataValues.id }, 
        attributes: [ 'id', 'code', 'text', 'createdAt' ],
        include: [
          {
            model: PostMedia,
            as: 'media',
            attributes: [ 'id', 'post_id', 'file_name', 'file_mime_type' ]
          },
          {
            model: User,
            as: 'user',
            attributes: [ 'name', 'id', 'username', 'createdAt' ],
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
          },
          {
            model: User,
            as: 'likers',
            attributes: [ 'id', 'username', 'name', 'createdAt' ]
          }
        ]
      }) as unknown ;
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
      post = await Post.findOne({ 
        where: { code: postCode },
        attributes: [ 'id', 'code', 'text', 'createdAt' ],
        include: [
          {
            model: PostMedia,
            as: 'media',
            attributes: [ 'id', 'post_id', 'file_name', 'file_mime_type' ]
          },
          {
            model: User,
            as: 'user',
            attributes: [ 'name', 'id', 'username', 'createdAt' ],
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
          },
          {
            model: User,
            as: 'likers',
            attributes: [ 'id', 'username', 'name', 'createdAt' ]
          }
        ]
      });
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

    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType> | null;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      if (post.getDataValue('user_id') !== authorizedUser.id) return res.status(403).json({ status: 'Error', message: 'You don\'t have permission to delete this post' });
      await post.destroy();
      await PostMedia.destroy({ where: { post_id: post.dataValues.id } });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Post deleted successfully' });
  };

  public static likePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const alreadyLikedPost = await PostLike.findOne({ where: { user_id: authorizedUser.id, post_id: post.dataValues.id } });
      if (alreadyLikedPost) return res.status(400).json({ status: 'Error', message: 'You already liked this post' });
      await PostLike.create({ post_id: post.dataValues.id, user_id: authorizedUser.id });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully liked post' });
  };

  public static unLikePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { auth } = req.body;
    const { user: authorizedUser } = auth;

    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const postLike = await PostLike.findOne({ where: { user_id: authorizedUser.id, post_id: post.dataValues.id } });
      if (!postLike) return res.status(400).json({ status: 'Error', message: 'You were not liked this post' });
      await postLike.destroy();
    } catch(e) {
      console.log(e);
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

    return res.status(200).json({ status: 'Ok', message: 'Removed post from saved successfully' });
  };

  public static getRandomPost = async (req: Request, res: Response) => {
    const { auth } = req.body;
    const { user } = auth;

    let posts;
    try {
      let where;
      if (!user.id) {
        where = { };
      } else {
        where = {
          user_id: { [Op.not]: user.id }
        };
      }

      posts = await Post.findAll({ where, include: [
        {
          model: PostMedia,
          as: 'media',
          attributes: [ 'id', 'file_name', 'file_mime_type' ]
        },
        {
          model: User,
          as: 'user',
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
            }
          ]
        },
        {
          model: User,
          as: 'likers',
          attributes: [ 'id', 'username', 'name', 'createdAt' ]
        }
      ], attributes: [ 'id', 'user_id', 'code', 'text', 'createdAt' ], limit: 5 }) as unknown;
    } catch(e) {
      console.log(e);
    }

    const result = (posts as Model[]).map((post) => post.toJSON());
    return res.status(200).json({ status: 'Ok', message: 'Successfully fetched posts', data: result });
  };
}

export default PostController;
