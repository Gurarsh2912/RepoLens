import RepositoryForm from "@/components/RepositoryForm";

export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">
        Analyze a repository
      </h1>

      <div className="mt-6">
        <RepositoryForm />
      </div>
    </main>
  );
}