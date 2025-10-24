import PublicOnly from "@/components/PublicyOnly";
import SignIn from "@/components/SignIn";



export default function SignInPage() {
  return (
    <PublicOnly>
      <SignIn />
    </PublicOnly>
  );
}