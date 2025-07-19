import { Button } from '@/components/ui/button';
import { Plus, Scan, Package, Tag } from 'lucide-react';
import { useI18n } from '@/contexts/translation-context';

interface ItemsPageHeaderProps {
  onAddItem: () => void;
  onAddWithUPC: () => void;
  onAddEnhanced: () => void;
  onToggleTagsManager: () => void;
  showTagsManager: boolean;
  isLoading: boolean;
}

export function ItemsPageHeader({
  onAddItem,
  onAddWithUPC,
  onAddEnhanced,
  onToggleTagsManager,
  showTagsManager,
  isLoading,
}: ItemsPageHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">{t('items.title')}</h1>
      <div className="flex gap-2">
        <Button
          onClick={onToggleTagsManager}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <Tag className="size-4 mr-2" />
          {showTagsManager ? t('items.hideTags') : t('items.manageTags')}
        </Button>
        <Button
          onClick={onAddWithUPC}
          disabled={isLoading}
          variant="outline"
        >
          <Scan className="size-4 mr-2" />
          {t('items.scanUPC')}
        </Button>
        <Button
          onClick={onAddEnhanced}
          disabled={isLoading}
          variant="outline"
        >
          <Package className="size-4 mr-2" />
          {t('items.addEnhanced')}
        </Button>
        <Button
          onClick={onAddItem}
          disabled={isLoading}
        >
          <Plus className="size-4 mr-2" />
          {t('items.addItem')}
        </Button>
      </div>
    </div>
  );
}
