import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, X, Tag, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Database } from "@/types/database"

type Tag = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type TagUpdate = Database['public']['Tables']['tags']['Update']

interface TagsManagerProps {
  className?: string
}

export function TagsManager({ className = "" }: TagsManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [newTag, setNewTag] = useState({
    name: '',
    tag_type: 'category',
    color: ''
  })

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error('Error loading tags:', error)
      toast.error('Failed to load tags')
    } finally {
      setIsLoading(false)
    }
  }

  const createTag = async () => {
    if (!newTag.name.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      setIsLoading(true)
      const tagData: TagInsert = {
        name: newTag.name.trim(),
        tag_type: newTag.tag_type,
        color: newTag.color.trim() || null
      }

      const { data, error } = await supabase
        .from('tags')
        .insert(tagData)
        .select()
        .single()

      if (error) throw error

      setTags([...tags, data])
      setNewTag({ name: '', tag_type: 'category', color: '' })
      setIsAdding(false)
      toast.success('Tag created successfully')
    } catch (error) {
      console.error('Error creating tag:', error)
      toast.error('Failed to create tag')
    } finally {
      setIsLoading(false)
    }
  }

  const updateTag = async (tag: Tag) => {
    if (!tag.name.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      setIsLoading(true)
      const updateData: TagUpdate = {
        name: tag.name.trim(),
        tag_type: tag.tag_type,
        color: tag.color?.trim() || null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', tag.id)
        .select()
        .single()

      if (error) throw error

      setTags(tags.map(t => t.id === tag.id ? data : t))
      setEditingTag(null)
      toast.success('Tag updated successfully')
    } catch (error) {
      console.error('Error updating tag:', error)
      toast.error('Failed to update tag')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTag = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all items.')) {
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      setTags(tags.filter(t => t.id !== tagId))
      toast.success('Tag deleted successfully')
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
    } finally {
      setIsLoading(false)
    }
  }

  const tagTypeColors = {
    category: 'bg-blue-100 text-blue-800',
    brand: 'bg-green-100 text-green-800',
    custom: 'bg-purple-100 text-purple-800'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-5" />
                Tags Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage product tags for categorization and filtering
              </p>
            </div>
            <Button
              onClick={() => setIsAdding(true)}
              disabled={isAdding || isLoading}
            >
              <Plus className="size-4 mr-2" />
              Add Tag
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Tag Form */}
          {isAdding && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-semibold mb-3">Add New Tag</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tag-name">Tag Name *</Label>
                  <Input
                    id="tag-name"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    placeholder="Enter tag name"
                  />
                </div>
                <div>
                  <Label htmlFor="tag-type">Type</Label>
                  <Select
                    value={newTag.tag_type}
                    onValueChange={(value) => setNewTag({ ...newTag, tag_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tag-color">Color (hex)</Label>
                  <Input
                    id="tag-color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    placeholder="#FF5733"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={createTag}
                  disabled={!newTag.name.trim() || isLoading}
                >
                  Add Tag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    setNewTag({ name: '', tag_type: 'category', color: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Tags List */}
          <div className="space-y-4">
            {isLoading && tags.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Loading tags...</p>
            ) : tags.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No tags found. Create your first tag to get started.
              </p>
            ) : (
              <div className="grid gap-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {editingTag?.id === tag.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingTag.name}
                            onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                            className="w-32"
                          />
                          <Select
                            value={editingTag.tag_type}
                            onValueChange={(value) => setEditingTag({ ...editingTag, tag_type: value })}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="category">Category</SelectItem>
                              <SelectItem value="brand">Brand</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={editingTag.color || ''}
                            onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                            placeholder="#color"
                            className="w-20"
                            maxLength={7}
                          />
                        </div>
                      ) : (
                        <>
                          <Badge
                            variant="outline"
                            className={tagTypeColors[tag.tag_type as keyof typeof tagTypeColors]}
                            style={tag.color ? { backgroundColor: tag.color + '20', borderColor: tag.color } : {}}
                          >
                            {tag.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">
                            {tag.tag_type}
                          </span>
                          {tag.color && (
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingTag?.id === tag.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateTag(editingTag)}
                            disabled={!editingTag.name.trim() || isLoading}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTag(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTag(tag)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTag(tag.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
