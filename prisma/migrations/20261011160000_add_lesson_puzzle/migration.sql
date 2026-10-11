-- CreateTable
CREATE TABLE "LessonPuzzle" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LessonPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonPuzzle_lessonId_puzzleId_key" ON "LessonPuzzle"("lessonId", "puzzleId");

-- AddForeignKey
ALTER TABLE "LessonPuzzle" ADD CONSTRAINT "LessonPuzzle_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPuzzle" ADD CONSTRAINT "LessonPuzzle_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
