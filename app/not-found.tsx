import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page py-20 max-w-md text-center">
      <h1 className="text-7xl font-bold text-primary mb-3">404</h1>
      <h2 className="text-2xl font-bold text-foreground mb-3">העמוד לא נמצא</h2>
      <p className="text-muted-foreground mb-8">
        ייתכן שהקישור פג תוקף, שהעסק עבר עדכון, או שהקלדתם כתובת לא תקינה.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition"
      >
        <Home className="h-4 w-4" />
        חזרה לעמוד הבית
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}
