import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'project',
    title: 'Project',
    type: 'document',
    groups: [
        {name: 'card', title: 'Card', default: true},
        {name: 'study', title: 'Case study'},
        {name: 'media', title: 'Media'},
    ],
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            group: 'card',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            group: 'card',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'mainImage',
            title: 'Main image',
            type: 'image',
            group: 'media',
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
            name: 'description',
            title: 'Description',
            type: 'text',
            group: 'card',
            description: 'One or two sentences. Shown on the project card and used as the meta description.',
        }),
        defineField({
            name: 'stack',
            title: 'Tech stack',
            type: 'array',
            group: 'card',
            of: [{type: 'string'}],
            options: {layout: 'tags'},
            description: 'Short tech labels shown on the project card, e.g. REACT, POSTGRES. Press Enter after each one to turn it into a tag — anything left untokenized is discarded on save.',
        }),
        defineField({
            name: 'liveUrl',
            title: 'Live URL',
            type: 'url',
            group: 'card',
        }),
        defineField({
            name: 'githubUrl',
            title: 'GitHub URL',
            type: 'url',
            group: 'card',
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published at',
            type: 'datetime',
            group: 'card',
        }),
        defineField({
            name: 'featured',
            title: 'Featured',
            type: 'boolean',
            group: 'card',
            initialValue: false,
            description: 'Featured projects surface on the home page. Keep this to two or three.',
        }),

        // ─── Case study ───
        // These drive /projects/<slug>. A project with no bodyMarkdown still
        // gets a detail page — it just renders the card data and links, so
        // adding the writeup later is purely additive.
        defineField({
            name: 'role',
            title: 'Role',
            type: 'string',
            group: 'study',
            description: 'What you did on this, e.g. "Solo — design, build, deploy".',
        }),
        defineField({
            name: 'timeframe',
            title: 'Timeframe',
            type: 'string',
            group: 'study',
            description: 'Human-readable span, e.g. "Jan–Apr 2026" or "3 weeks".',
        }),
        defineField({
            name: 'outcome',
            title: 'Outcome',
            type: 'text',
            group: 'study',
            rows: 3,
            description:
                'What actually happened — including when the answer is "nothing much". A build that found no traction, plus a clear reading of why, is worth more than a vague claim of success. Use real numbers only where they exist.',
        }),
        defineField({
            name: 'bodyMarkdown',
            title: 'Case study (Markdown)',
            type: 'text',
            group: 'study',
            rows: 30,
            description:
                'Four H2 sections, same order every time: Problem, Approach, Tradeoffs, Outcome. Tradeoffs is the one that matters — what you rejected and why. Outcome is for what happened, not for what you wish had happened.',
        }),

        // ─── Media ───
        defineField({
            name: 'gallery',
            title: 'Gallery',
            type: 'array',
            group: 'media',
            description: 'Additional screenshots shown below the case study.',
            of: [
                {
                    type: 'image',
                    options: {hotspot: true},
                    fields: [
                        defineField({
                            name: 'alt',
                            title: 'Alternative text',
                            type: 'string',
                            description: 'Describes the image for screen readers and SEO.',
                        }),
                        defineField({
                            name: 'caption',
                            title: 'Caption',
                            type: 'string',
                            description: 'Shown next to the FIG. number beneath the image.',
                        }),
                    ],
                },
            ],
        }),
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'role',
            media: 'mainImage',
        },
    },
})
