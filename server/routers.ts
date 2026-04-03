import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createQuizSubmission, getQuizSubmissions, updateQuizSubmissionStatus } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  quiz: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Invalid email"),
          phone: z.string().optional().nullable(),
          score: z.number().min(0).max(100),
          readinessLevel: z.string(),
          answers: z.string(),
          ipAddress: z.string().optional(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await createQuizSubmission({
            name: input.name,
            email: input.email,
            phone: input.phone || null,
            score: input.score,
            readinessLevel: input.readinessLevel,
            answers: input.answers,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
          });
          return { success: true };
        } catch (error) {
          console.error("Failed to submit quiz:", error);
          throw new Error("Failed to submit quiz");
        }
      }),

    list: publicProcedure
      .input(
        z.object({
          limit: z.number().default(100),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await getQuizSubmissions(input.limit, input.offset);
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "converted", "archived"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await updateQuizSubmissionStatus(input.id, input.status, input.notes);
          return { success: true };
        } catch (error) {
          console.error("Failed to update submission:", error);
          throw new Error("Failed to update submission");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
