import PublicOnly from "@/components/PublicyOnly";
import SignUp from "@/components/SignUpForm";


export default function SignUpPage() {
  return (
    <PublicOnly>
      <SignUp/>
    </PublicOnly>
  );
}