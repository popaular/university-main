"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, ArrowLeft } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  graduationYear?: number;
  gpa?: number;
  satScore?: number;
  actScore?: number;
  targetCountries: string[];
  intendedMajors: string[];
}

interface ProfileForm {
  graduationYear?: number;
  gpa?: number;
  satScore?: number;
  actScore?: number;
  targetCountries: string;
  intendedMajors: string;
}

export default function StudentProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>({
    targetCountries: '',
    intendedMajors: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.role !== 'STUDENT') {
            router.push("/dashboard");
            return;
          }
          setUser(userData);
          await fetchProfile();
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/student/profile", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          graduationYear: data.graduationYear || undefined,
          gpa: data.gpa || undefined,
          satScore: data.satScore || undefined,
          actScore: data.actScore || undefined,
          targetCountries: data.targetCountries?.join(', ') || '',
          intendedMajors: data.intendedMajors?.join(', ') || '',
        });
      }
    } catch (error) {
      console.error("获取学生资料失败:", error);
      toast({
        title: "错误",
        description: "获取学生资料失败，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const targetCountriesArray = profile.targetCountries
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const intendedMajorsArray = profile.intendedMajors
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          graduationYear: profile.graduationYear,
          gpa: profile.gpa,
          satScore: profile.satScore,
          actScore: profile.actScore,
          targetCountries: targetCountriesArray,
          intendedMajors: intendedMajorsArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "成功",
          description: "个人资料已更新",
        });
        
        // 延迟1秒后返回上一页
        setTimeout(() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/dashboard');
          }
        }, 1000);
      } else {
        toast({
          title: "错误",
          description: data.error || "更新失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("更新学生资料失败:", error);
      toast({
        title: "错误",
        description: "更新失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: name === 'graduationYear' || name === 'satScore' || name === 'actScore'
        ? (value ? parseInt(value) : undefined)
        : name === 'gpa'
        ? (value ? parseFloat(value) : undefined)
        : value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">完善个人资料</h1>
              <p className="mt-2 text-gray-600">
                填写您的学术背景和申请目标，帮助我们为您提供更精准的大学推荐
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/dashboard');
                }
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="graduationYear">毕业年份</Label>
                  <Input
                    id="graduationYear"
                    name="graduationYear"
                    type="number"
                    min="2020"
                    max="2030"
                    placeholder="例如：2025"
                    value={profile.graduationYear || ''}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    预计高中毕业年份
                  </p>
                </div>

                <div>
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    name="gpa"
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    placeholder="例如：3.85"
                    value={profile.gpa || ''}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    满分4.0制的GPA
                  </p>
                </div>

                <div>
                  <Label htmlFor="satScore">SAT分数</Label>
                  <Input
                    id="satScore"
                    name="satScore"
                    type="number"
                    min="400"
                    max="1600"
                    placeholder="例如：1450"
                    value={profile.satScore || ''}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    总分1600分制
                  </p>
                </div>

                <div>
                  <Label htmlFor="actScore">ACT分数</Label>
                  <Input
                    id="actScore"
                    name="actScore"
                    type="number"
                    min="1"
                    max="36"
                    placeholder="例如：32"
                    value={profile.actScore || ''}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    总分36分制
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="targetCountries">目标国家</Label>
                <Input
                  id="targetCountries"
                  name="targetCountries"
                  type="text"
                  placeholder="美国, 英国, 加拿大"
                  value={profile.targetCountries}
                  onChange={handleChange}
                />
                <p className="text-sm text-gray-500 mt-1">
                  用逗号分隔多个国家，例如：美国, 英国, 加拿大
                </p>
              </div>

              <div>
                <Label htmlFor="intendedMajors">意向专业</Label>
                <Input
                  id="intendedMajors"
                  name="intendedMajors"
                  type="text"
                  placeholder="计算机科学, 商业管理, 心理学"
                  value={profile.intendedMajors}
                  onChange={handleChange}
                />
                <p className="text-sm text-gray-500 mt-1">
                  用逗号分隔多个专业，例如：计算机科学, 商业管理, 心理学
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存资料
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>填写建议</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">GPA填写说明</h3>
                <p>请填写您最新的GPA成绩，如果是百分制请转换为4.0制。</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">标准化考试</h3>
                <p>如果您还没有参加SAT/ACT考试，可以留空或填写预计分数。</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">目标设定</h3>
                <p>明确的目标国家和专业将帮助我们为您推荐更合适的大学。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}