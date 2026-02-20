import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
            <SignUp />
        </div>
    );
}
