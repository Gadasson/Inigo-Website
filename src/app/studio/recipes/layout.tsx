import RecipeCapabilityGate from '@/components/studio/recipes/RecipeCapabilityGate';

export default function RecipesLayout({ children }: { children: React.ReactNode }) {
  return <RecipeCapabilityGate>{children}</RecipeCapabilityGate>;
}
