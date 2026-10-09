import RecipeEditor from '@/components/studio/recipes/RecipeEditor';

export const dynamic = 'force-dynamic';

export default function NewRecipePage() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container studio-workspace__container--form">
        <RecipeEditor mode="create" />
      </div>
    </main>
  );
}
