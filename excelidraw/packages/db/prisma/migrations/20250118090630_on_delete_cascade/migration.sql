-- DropForeignKey
ALTER TABLE "Drawing" DROP CONSTRAINT "Drawing_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Drawing" DROP CONSTRAINT "Drawing_userId_fkey";

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
