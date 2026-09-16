import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      group: 'content',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      group: 'content',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'author',
      group: 'content',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'},
    }),
    defineField({
      name: 'mainImage',
      group: 'content',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'Describes the image for screen readers and SEO.',
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      group: 'content',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'tags',
      group: 'content',
      title: 'Tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'bodyMarkdown',
      group: 'content',
      title: 'Body (Markdown)',
      type: 'markdown',
      description: 'GitHub-flavored Markdown. Drag-and-drop images to upload to Sanity.',
    }),
    defineField({
      name: 'excerpt',
      group: 'content',
      title: 'Excerpt (optional)',
      type: 'text',
      rows: 3,
      description: 'Short summary for lists; if empty, a snippet will be generated.',
    }),
    // ─── SEO ───
    // Every one of these is an override. Left empty, the page falls back
    // to the title and excerpt, which is the right answer most of the
    // time — these exist for the posts where it isn't.
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      group: 'seo',
      description:
        'Overrides the browser tab and search result title. Defaults to the post title. Around 60 characters before Google truncates it.',
      validation: (Rule) => Rule.max(70).warning('Likely to be truncated in search results.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      group: 'seo',
      description:
        'What search engines and social cards show. Falls back to the excerpt. Aim for 150 to 160 characters — it is a pitch for the click, not a summary.',
      validation: (Rule) => Rule.max(180).warning('Likely to be truncated at around 160 characters.'),
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      group: 'seo',
      description:
        'Only if this post was published somewhere else first. Points search engines at the original so the two do not compete.',
    }),
    defineField({
      name: 'noindex',
      title: 'Hide from search engines',
      type: 'boolean',
      group: 'seo',
      initialValue: false,
      description:
        'Adds a noindex tag and drops the post from the sitemap. It stays on the site and in the feed.',
    }),

    // Legacy body retained for compatibility — the site renders
    // bodyMarkdown only. Hidden until content is confirmed migrated.
    defineField({
      name: 'body',
      title: 'Body (legacy)',
      type: 'blockContent',
      hidden: true,
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const {author} = selection
      return {...selection, subtitle: author && `by ${author}`}
    },
  },
})
