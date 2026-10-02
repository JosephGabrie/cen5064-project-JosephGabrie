import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CardImageProps {
  id: string;
  courseName: string;
  subject: string;
  teacher: string;
  roomNumber: string;
}

import Link from "next/link"

export function CardImage({ id, courseName, subject, teacher, roomNumber }: CardImageProps) {
  const colorClass = decideSubjectColor(subject);

  return (
    <Link href={`/class/${id}`} className="block transition-transform hover:scale-[1.02]">
    <Card className="relative mx-auto w-full max-w-sm pt-0 h-full">
      {/* 1. Fixed quotes around JSX braces */}
      {/* 2. Fixed typo 'abosolute' -> 'absolute' */}
      <div className={`absolute inset-0 z-30 aspect-video ${colorClass}`} />
      <div
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction>
        </CardAction>
        <CardTitle> {courseName} </CardTitle>
        <CardDescription>
          {subject} | {teacher} <br /> {roomNumber}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full">View Event</Button>
      </CardFooter>
    </Card>
    </Link>
  )
}

function decideSubjectColor(subject: string = ""): string {
  // Returns full Tailwind classes so Tailwind's compiler does not strip them out
  switch (subject.toLowerCase()) {
    case "science":
      return "bg-green-500/35";
    case "history": // Fixed typo from 'useImperativeHandletory'
      return "bg-blue-500/35";
    case "spanish":
      return "bg-yellow-500/35";
    case "mathematics":
    case "math":
      return "bg-red-500/35";
    case "elective":
    default:
      return "bg-pink-500/35";
  }
}
