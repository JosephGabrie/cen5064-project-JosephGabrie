"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="p-8 flex items-start justify-start">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Welcome to your profile dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Name</span>
              <span className="text-muted-foreground">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Email</span>
              <span className="text-muted-foreground">{user?.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
