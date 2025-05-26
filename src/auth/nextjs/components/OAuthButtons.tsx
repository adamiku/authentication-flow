import { Button } from "@/components/ui/button";
import { oAuthSignIn } from "../actions";

export function OAuthButtons() {
  return (
    <div className="flex gap-4">
      <Button
        type="button"
        onClick={async () => await oAuthSignIn("discord")}
      >
        Discord
      </Button>
      <Button
        type="button"
        onClick={async () => await oAuthSignIn("github")}
      >
        GitHub
      </Button>
    </div>
  )
}
