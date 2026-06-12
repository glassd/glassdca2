import {defineField, defineType} from 'sanity'

// Singleton: availability status shown on the home badge and the
// contact status panel, editable from the studio so it can't go stale
// in two hardcoded places.
export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'available',
      title: 'Available for work',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'availabilityLabel',
      title: 'Availability badge (home)',
      type: 'string',
      description: 'Short badge text, e.g. "AVAILABLE NOW" or "BOOKED UNTIL Q1".',
      initialValue: 'AVAILABLE NOW',
    }),
    defineField({
      name: 'availabilityDetail',
      title: 'Availability detail (contact)',
      type: 'string',
      description: 'Status panel text, e.g. "OPEN TO NEW PROJECTS — Q3 / Q4 2026".',
      initialValue: 'OPEN TO NEW PROJECTS',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site Settings'}),
  },
})
