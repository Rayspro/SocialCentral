import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Trash2, Eye, Edit } from "lucide-react";
import { useState } from "react";
import type { Content } from "@shared/schema";

export default function MediaLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: content, isLoading } = useQuery({
    queryKey: ["/api/content"],
  });

  const filteredContent = content?.filter((item: Content) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return "🎥";
      case "image": return "🖼️";
      default: return "📄";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400";
      case "pending": return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400";
      case "rejected": return "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400";
      default: return "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Header title="Media Library" subtitle="Manage your generated content and media assets" />
      
      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>Content Library</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContent.map((item: Content) => (
                <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 rounded-t-lg flex items-center justify-center text-4xl">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.contentUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(item.contentUrl!, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Content</th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Type</th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Created</th>
                        <th className="text-left p-4 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredContent.map((item: Content) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-lg">
                                {getTypeIcon(item.type)}
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{item.type}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-400">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {item.contentUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(item.contentUrl!, '_blank')}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {filteredContent.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No content found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? "Try adjusting your search terms" : "Start creating content to see it here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}