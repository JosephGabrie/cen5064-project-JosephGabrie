import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, MapPin, User } from "lucide-react"

interface CardImageProps {
  id: string
  courseName: string
  subject: string
  teacher: string
  roomNumber: string
}

export function CardImage({
  id,
  courseName,
  subject,
  teacher,
  roomNumber,
}: CardImageProps) {
  const bannerStyle = decideSubjectBanner(subject)

  return (
    <Link
      href={`/class/${id}`}
      aria-label={`Open ${courseName} (${subject}) taught by ${teacher}`}
      className="group block h-full rounded-2xl transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#1d7874] focus-visible:ring-offset-2"
    >
      <Card className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#679289]/35 bg-white pt-0 shadow-sm transition-shadow group-hover:border-[#1d7874] group-hover:shadow-md dark:bg-[#0d2b30]">
        <div>
          <div
            className={`relative flex h-28 w-full flex-col justify-between border-b border-[#679289]/25 p-4 ${bannerStyle.bg}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${bannerStyle.badge}`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                {subject || "General"}
              </span>
              {roomNumber && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#071e22] shadow-2xs">
                  <MapPin className="h-3 w-3 text-[#1d7874]" />
                  Room {roomNumber}
                </span>
              )}
            </div>
          </div>

          <CardHeader className="space-y-2 p-6 pb-4">
            <CardTitle className="text-xl font-bold tracking-tight text-[#071e22] group-hover:text-[#1d7874] dark:text-white">
              {courseName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm font-medium text-[#071e22]/75 dark:text-[#f8fbfa]/80">
              <User className="h-4 w-4 text-[#1d7874]" />
              <span>Instructor: {teacher}</span>
            </CardDescription>
          </CardHeader>
        </div>

        <CardFooter className="p-6 pt-2">
          <Button className="w-full bg-[#1d7874] text-white group-hover:bg-[#071e22]">
            Open Class Portal
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

function decideSubjectBanner(subject: string = ""): {
  bg: string
  badge: string
} {
  switch (subject.toLowerCase()) {
    case "science":
      return {
        bg: "bg-[#1d7874]/15",
        badge: "bg-[#1d7874] text-white",
      }
    case "history":
      return {
        bg: "bg-[#679289]/25",
        badge: "bg-[#071e22] text-white",
      }
    case "spanish":
      return {
        bg: "bg-[#f4c095]/45",
        badge: "bg-[#071e22] text-white",
      }
    case "mathematics":
    case "math":
      return {
        bg: "bg-[#1d7874]/20",
        badge: "bg-[#1d7874] text-white",
      }
    default:
      return {
        bg: "bg-[#f4c095]/30",
        badge: "bg-[#1d7874] text-white",
      }
  }
}
