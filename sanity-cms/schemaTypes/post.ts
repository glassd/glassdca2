import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'},
    }),
    defineField({
      name: 'mainImage',
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
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'bodyMarkdown',
      title: 'Body (Markdown)',
      type: 'markdown',
      description: 'GitHub-flavored Markdown. Drag-and-drop images to upload to Sanity.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt (optional)',
      type: 'text',
      rows: 3,
      description: 'Short summary for lists; if empty, a snippet will be generated.',
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
