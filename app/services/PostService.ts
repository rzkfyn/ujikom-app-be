import Post from '../models/Post.js';
import PostMedia from '../models/PostMedia.js';
import SavedPost from '../models/SavedPost.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import ProfileMedia from '../models/ProfileMedia.js';
import Comment from '../models/Comment.js';
import SharedPost from '../models/SharedPost.js';
import { Model, Transaction } from 'sequelize';
import { Literal } from 'sequelize/types/utils.js';
import NotificationService from './NotificationService.js';

class PostService {
  private notificationService = new NotificationService();
  private relations = [
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
    },
    {
      model: User,
      as: 'saved_by_users',
      attributes: [ 'id', 'username', 'name', 'createdAt' ]
    },
    {
      model: User,
      as: 'mentioned_users',
      attributes: [ 'id', 'username', 'name', 'createdAt' ]
    },
    {
      model: Comment,
      as: 'comments'
    },
    {
      model: Post,
      as: 'shared_on_posts'
    },
    {
      model: Post,
      as: 'shared_post',
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
          as: 'mentioned_users',
          attributes: [ 'id', 'username', 'name', 'createdAt' ]
        }
      ]
    }
  ];

  public getSinglePostByCode = async (code: string) => {
    const post = await Post.findOne({ where: { code }, include: this.relations});
    if (!post) return null;

    const result = post.toJSON();
    result.shared_post = result.shared_post[0] ? result.shared_post[0] : null;

    return result;
  };
  
  public getSinglePostById = async (id: number) => {
    console.log('called');
    const post = await Post.findOne({ where: { id }, include: this.relations});
    console.log(post);
    if (!post) return null;
    
    const result = post.toJSON();
    result.shared_post = result.shared_post[0] ? result.shared_post[0] : null;

    return result;
  };

  public getUserPosts = async (userId: number) => {
    const posts = await Post.findAll({ where: { user_id: userId }, include: this.relations });
    const result = (posts as Model[]).map((post) => {
      const jsonPost = post.toJSON();
      jsonPost.shared_post = jsonPost.shared_post[0] ? jsonPost.shared_post[0] : null;
      return jsonPost;
    });

    return result;
  };

  public removePost = async (postId: number, transaction: Transaction) => {
    await Post.destroy({ where: { id: postId }, transaction });
    await PostMedia.destroy({ where: { post_id: postId }, transaction });
    await SavedPost.destroy({ where: { post_id: postId }, transaction });
    await SharedPost.destroy({ where: { post_id: postId }, transaction });
    await this.notificationService.removeNotificationsByEvent('post', postId, transaction);
  };

  public getSavedPosts = async (userId: number ) => {
    const savedPosts = await SavedPost.findAll({ where: { user_id: userId }, include: { model: Post, as: 'post', include: this.relations }});
    let result = savedPosts.map((savedPost) => savedPost.toJSON().post);

    result = result.map((post) => {
      post.shared_post = post.shared_post[0] ? post.shared_post[0] : null;
      return post;
    });

    return result;
  };

  public getRandomPosts = async (where: Literal | undefined) => {
    const posts = await Post.findAll({
      where,
      include: this.relations,
      attributes: [ 'id', 'user_id', 'code', 'text', 'createdAt' ], 
      order: [ ['id', 'DESC'] ],
      limit: 5
    });

    const result = (posts as Model[]).map((post) => {
      const jsonPost = post.toJSON();
      jsonPost.shared_post = jsonPost.shared_post[0] ? jsonPost.shared_post[0] : null;
      return jsonPost;
    });

    return result;
  };
}

export default PostService;
