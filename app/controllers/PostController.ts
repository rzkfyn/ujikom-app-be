import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { nanoid } from 'nanoid';
import { Model } from 'sequelize';
import Post from '../models/Post.js';
import PostLike from '../models/PostLike.js';
import PostMedia from '../models/PostMedia.js';
import { post as postType } from '../types/types.js';

class PostController {
  public static createPost = async (req: Request, res: Response) => {
    const { text, userData } = req.body;
    const media = req.files?.media as UploadedFile[];
    const validatedMedia: UploadedFile[] = [];

    try {
      const postCode = nanoid(8);
      const newPost = await Post.create({ code: postCode, text, user_id: userData.id }) as Model<postType, postType>;
      if (media[0]) {
        media.forEach(async (file) => {
          if (file.size > (20 * 1024 * 1024)) return res.status(400).json({ status: 'Error', message: 'Max size for a file to upload is 20mb' });
          const newFileName = `${+ new Date()}${file.name.split('.')[0]}.${file.name.split('.')[file.name.split('.').length-1]}`;
          file.name = newFileName;
          validatedMedia.push(file);
        });

        validatedMedia.forEach(async (file) => {
          await PostMedia.create({ post_id: newPost.dataValues.id, file_mime_type: file.mimetype, file_name: file.name });
        });
      }
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }
    return res.status(201).json({ status: 'Ok', message: 'Post created successfully' });
  };

  // public static getPost = async (req: Request, res: Response) => {
  //   const { postCode } = req.params;
  //   const { userData } = req.body;

  //   let post;
  //   let postLikes;
  //   try {
  //     const post = await Post.findOne({ where: { code: postCode } }) as postType | null;
  //     if (!post) return res.status(404)
  //     const postLikes = await PostLike.findAll({ where: { post_id: post.id } }) as unknown;
      
  //   } catch(e) {
  //     console.log(e);
  //     return res.status(500).json({ status: 'Error', message: 'Internal server error' });
  //   }

  // };

  public static deletePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { userData } = req.body;

    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      if (post.getDataValue('user_id') !== userData.id) return res.status(403).json({ status: 'Error', message: 'You don\'t have permission to delete this post' });
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
    const { userData } = req.body;

    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const alreadyLikedPost = await PostLike.findOne({ where: { user_id: userData.id, post_id: post.dataValues.id } });
      if (alreadyLikedPost) return res.status(400).json({ status: 'Error', message: 'You already liked this post' });
      await PostLike.create({ post_id: post.dataValues.id, user_id: userData.id });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully liked post' });
  };

  public static unLikePost = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { userData } = req.body;

    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType>;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      const postLike = await PostLike.findOne({ where: { user_id: userData.id, post_id: post.dataValues.id } });
      if (!postLike) return res.status(400).json({ status: 'Error', message: 'You were not liked this post' });
      await postLike.destroy();
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(200).json({ status: 'Ok', message: 'Successfully liked post' });
  };
}

export default PostController;
