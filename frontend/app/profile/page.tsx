import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
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
              <span className="text-muted-foreground">User</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Email</span>
              <span className="text-muted-foreground">student2@gmail.com</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
