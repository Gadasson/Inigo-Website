import RecipeEditorRoute from '@/components/studio/recipes/RecipeEditorRoute';

export const dynamic = 'force-dynamic';

export default function RecipeEditorPage() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container studio-workspace__container--form">
        <RecipeEditorRoute />
      </div>
    </main>
  );
}
