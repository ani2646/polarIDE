"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";
import { revalidatePath } from "next/cache";

export const toggleStarMarked = async (
  playgroundId: string,
  isChecked: boolean
) => {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error("User Id is Required");
  }

  try {
    if (isChecked) {
      await db.starMark.create({
        data: {
          userId: userId!,
          playgroundId,
          isMarked: isChecked,
        },
      });
    } else {
      await db.starMark.delete({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId: playgroundId,
          },
        },
      });
    }

    revalidatePath("/dashboard");
    return { success: true, isMarked: isChecked };
  } catch (error) {
    console.error("Error updating problem:", error);
    return { success: false, error: "Failed to update problem" };
  }
};

export const getAllPlaygroundForUser = async () => {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const playground = await db.playground.findMany({
      where: {
        userId: user.id,
      },
      include: {
        user: true,
        Starmark: {
          where: {
            userId: user.id,
          },
          select: {
            isMarked: true,
          },
        },
      },
    });

    return playground;
  } catch (error) {
    console.log(error);
  }
};

export const createPlayground = async (data: {
  title: string;
  template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
  description?: string;
}) => {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const { template, title, description } = data;

  try {
    const playground = await db.playground.create({
      data: {
        title: title,
        description: description,
        template: template,
        userId: user.id,
      },
    });

    return playground;
  } catch (error) {
    console.log(error);
  }
};

export const deleteProjectById = async (id: string) => {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const playground = await db.playground.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!playground) {
      throw new Error("Project not found");
    }

    if (playground.userId !== user.id) {
      throw new Error("Forbidden");
    }

    await db.playground.delete({
      where: {
        id,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
) => {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const playground = await db.playground.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!playground) {
      throw new Error("Project not found");
    }

    if (playground.userId !== user.id) {
      throw new Error("Forbidden");
    }

    await db.playground.update({
      where: {
        id,
      },
      data: data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

export const duplicateProjectById = async (id: string) => {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const originalPlayground = await db.playground.findUnique({
      where: { id },
    });
    if (!originalPlayground) {
      throw new Error("Original playground not found");
    }

    if (originalPlayground.userId !== user.id) {
      throw new Error("Forbidden");
    }

    await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId: originalPlayground.userId,
      },
    });

    revalidatePath("/dashboard");
    // no return statement — function now returns Promise<void>
  } catch (error) {
    console.error("Error duplicating project:", error);
  }
};
