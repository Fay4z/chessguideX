-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "quizId" TEXT;

-- CreateTable
CREATE TABLE "CourseTestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseTestAttempt_userId_courseId_key" ON "CourseTestAttempt"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_quizId_key" ON "Course"("quizId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTestAttempt" ADD CONSTRAINT "CourseTestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTestAttempt" ADD CONSTRAINT "CourseTestAttempt_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
