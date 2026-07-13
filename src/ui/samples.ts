/**
 * A small built-in before/after pair so a first-time visitor can see a
 * report without bringing their own spec. Deliberately covers more than
 * one rule (a newly required field, a removed response field, an enum
 * restriction, a new optional field) so the sample report demonstrates
 * both the breaking and safe sections.
 */

export const SAMPLE_OLD_SPEC = JSON.stringify(
  {
    openapi: "3.0.0",
    info: { title: "Task API", version: "1.0.0" },
    paths: {
      "/tasks": {
        post: {
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                  },
                  required: ["title"],
                },
              },
            },
          },
          responses: {
            "201": {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      internal_notes: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  null,
  2,
);

export const SAMPLE_NEW_SPEC = JSON.stringify(
  {
    openapi: "3.0.0",
    info: { title: "Task API", version: "2.0.0" },
    paths: {
      "/tasks": {
        post: {
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                    assignee_id: { type: "string" },
                  },
                  required: ["title", "assignee_id"],
                },
              },
            },
          },
          responses: {
            "201": {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      created_at: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  null,
  2,
);
