import { Playground, User } from "@prisma/client";

export type Project = Playground & {
  user: User;
  Starmark: { isMarked: boolean }[];
};