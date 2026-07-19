import { redirect } from "next/navigation";

// Products have been migrated to Menu Items
export default function ProductsPage() {
    redirect("/menu-items");
}
