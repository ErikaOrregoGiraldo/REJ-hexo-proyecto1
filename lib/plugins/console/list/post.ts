import { gray, magenta, underline } from 'picocolors';
import table from 'text-table';
import { stringLength } from './common';
import type Hexo from '../../../hexo';

function mapName(item) {
  return item.name;
}

function listPost(this: Hexo, args: any): void {
  const Post = this.model('Post');
  const searchQuery = args.title ? args.title.toLowerCase() : null; // Obtén el título a buscar

  let posts = Post.sort({ published: -1, date: 1 });

  // Filtrar por título si se proporciona un título
  if (searchQuery) {
    posts = posts.filter(post => post.title.toLowerCase().includes(searchQuery));
  }

  const data = posts.map(post => {
    const date = post.published ? post.date.format('YYYY-MM-DD') : 'Draft';
    const tags = post.tags.map(mapName);
    const categories = post.categories.map(mapName);

    return [
      gray(date),
      post.title,
      magenta(post.source),
      categories.join(', '),
      tags.join(', ')
    ];
  });

  // Table header
  const header = ['Date', 'Title', 'Path', 'Category', 'Tags'].map(str => underline(str));

  data.unshift(header);

  const t = table(data, {
    stringLength
  });

  console.log(t);
  if (data.length === 1) console.log('No posts found.');
}

export = listPost;
