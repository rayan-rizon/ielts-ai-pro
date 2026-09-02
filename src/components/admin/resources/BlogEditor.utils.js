export const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'image'],
    ['clean'],
  ],
};

export const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'bullet',
  'indent',
  'link',
  'image',
];

export const BLOG_FORM_DEFAULTS = {
  title: '',
  slug: '',
  description: '',
  meta_description: '',
  category: 'Study Planning',
  reading_minutes: 6,
  published_at: null,
  featured: false,
  content: '',
  thumbnail_url: '',
  is_published: false,
  seo_tags: [],
};

export function extractSeoTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === 'string')
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  return [];
}

export function extractBlogEditorStrings(source) {
  return {
    title: source.title || '',
    slug: source.slug || '',
    description: source.description || '',
    meta_description: source.meta_description || source.description || '',
    content: source.content || '',
    thumbnail_url: source.thumbnail_url || '',
  };
}

export function normalizeBlogEditorData(source = {}) {
  return {
    ...BLOG_FORM_DEFAULTS,
    ...source,
    ...extractBlogEditorStrings(source),
    category: source.category || BLOG_FORM_DEFAULTS.category,
    reading_minutes: Number(source.reading_minutes) || BLOG_FORM_DEFAULTS.reading_minutes,
    published_at: source.published_at || null,
    featured: Boolean(source.featured),
    is_published: Boolean(source.is_published),
    seo_tags: extractSeoTags(source.seo_tags),
  };
}

export async function loadImage(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file);

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function createSeoCover(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose a valid image file.');

  const image = await loadImage(file);
  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot optimize the cover image.');

  context.drawImage(image, 0, 0, width, height);

  const fontSize = Math.max(18, Math.round(width * 0.018));
  const paddingX = Math.round(fontSize * 0.75);
  const paddingY = Math.round(fontSize * 0.48);
  const margin = Math.max(18, Math.round(width * 0.022));
  const watermark = 'IELTS Ai Pro';
  context.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  context.textBaseline = 'middle';
  const textWidth = context.measureText(watermark).width;
  const boxWidth = Math.ceil(textWidth + paddingX * 2);
  const boxHeight = Math.ceil(fontSize + paddingY * 2);
  const boxX = width - margin - boxWidth;
  const boxY = height - margin - boxHeight;

  context.fillStyle = 'rgba(67, 56, 202, 0.84)';
  if (typeof context.roundRect === 'function') {
    context.beginPath();
    context.roundRect(boxX, boxY, boxWidth, boxHeight, Math.round(boxHeight * 0.28));
    context.fill();
  } else {
    context.fillRect(boxX, boxY, boxWidth, boxHeight);
  }
  context.fillStyle = '#ffffff';
  context.fillText(watermark, boxX + paddingX, boxY + boxHeight / 2);

  const webpBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
  if (!webpBlob) throw new Error('WebP conversion failed.');

  const baseName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .toLowerCase();
  return new File([webpBlob], `${baseName || 'blog-cover'}.webp`, { type: 'image/webp' });
}

export const QUILL_STYLES = `
  .ql-toolbar {
    border: none !important;
    border-bottom: 1px solid rgb(231 229 228) !important;
    background-color: rgb(250 250 249);
    padding: 8px 10px !important;
  }
  .ql-container {
    border: none !important;
    background-color: #fff;
    font-family: inherit;
    font-size: 1rem;
  }
  .ql-editor {
    min-height: 380px;
    padding: 20px;
    line-height: 1.75;
  }
  .ql-editor h1,
  .ql-editor h2,
  .ql-editor h3 {
    font-weight: 800;
    margin-top: 1.4em;
    margin-bottom: 0.5em;
  }
  .ql-editor p {
    margin-bottom: 1em;
  }
  .dark .ql-toolbar {
    background-color: rgb(19 19 21);
    border-bottom-color: rgba(255,255,255,0.08) !important;
  }
  .dark .ql-container {
    background-color: rgb(19 19 21);
  }
  .dark .ql-editor {
    color: rgb(245 245 244);
  }
  .dark .ql-editor.ql-blank::before {
    color: rgba(255,255,255,0.35);
  }
  .dark .ql-snow .ql-stroke {
    stroke: rgba(255,255,255,0.55);
  }
  .dark .ql-snow .ql-fill {
    fill: rgba(255,255,255,0.55);
  }
  .dark .ql-snow .ql-picker {
    color: rgba(255,255,255,0.7);
  }
`;

export function buildBlogPayload(formData, finalThumbnailUrl) {
  const publishedAt =
    formData.is_published && !formData.published_at
      ? new Date().toISOString()
      : formData.published_at;
  const url = formData.slug ? `${window.location.origin}/blog/${formData.slug}` : '';
  return {
    ...formData,
    content_type: 'blog',
    url,
    thumbnail_url: finalThumbnailUrl,
    published_at: publishedAt,
  };
}
