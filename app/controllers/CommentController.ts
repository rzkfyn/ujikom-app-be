import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { Model } from 'sequelize';
import Database from '../core/Database.js';
import Comment from '../models/Comment.js';
import CommentMedia from '../models/CommentMedia.js';
import Post from '../models/Post.js';
import { post as postType } from '../types/types.js';

class CommentController {
  public static sendComment = async (req: Request, res: Response) => {
    const { postCode } = req.params;
    const { text, replied_comment_id, auth } = req.body;
    const { user: authorizedUser } = auth;
    let media = req.files?.media as UploadedFile | UploadedFile[];

    if (!Array.isArray(media) && media) media = [media];
    if (!text && !media) return res.status(400).json({ status: 'Error', message: 'Comment\'s text or media is required' });
    if (media && media[0]) {
      for (const file of media as UploadedFile[]) {
        const { mimetype, size } = file;
        if (!mimetype.startsWith('image')) return res.status(400).json({ status: 'Error', message: 'Only image files are allowed' });
        if (size > 1024 * 1024 * 5) return res.status(400).json({ status: 'Error', message: 'File size must be less than 5MB' });
        file.name = `${Date.now()}-${file.name}`;
      }
    }

    const transaction = await Database.transaction();
    try {
      const post = await Post.findOne({ where: { code: postCode } }) as Model<postType, postType> | null;
      if (!post) return res.status(404).json({ status: 'Error', message: 'Post not found' });
      await Comment.create({ user_id: authorizedUser.id, post_id: post.dataValues.id, replied_comment_id: replied_comment_id ?? null, text }, { transaction });
      if (media) {
        if (Array.isArray(media)) {
          for (const file of media as UploadedFile[]) {
            const { name, mimetype } = file;
            await CommentMedia.create({ file_name: name, file_mime_type: mimetype });
          }
        }
      }

      await transaction.commit();
    } catch(e) {
      console.log(e);
      await transaction.rollback();
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(201).json({ status: 'Error', message: 'Successfully sent comment' });
  };
}

export default CommentController;
