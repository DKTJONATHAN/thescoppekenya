import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { getPostBySlug, getLatestPosts, getAllPosts, type Post } from "@/lib/markdown";
import {
  Clock, Calendar, Share2, Facebook, Linkedin,
  ChevronLeft, ArrowUp, Eye, MessageCircle, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { XIcon } from "@/components/XIcon";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Helmet } from "react-helmet-async";
import AdUnit from "@/components/AdUnit";
import { LiveUpdatesTimeline } from "@/components/news/LiveUpdatesTimeline";
import { ArticleBreadcrumbs } from "@/components/articles/ArticleBreadcrumbs";
import { StickyMobileShare } from "@/components/articles/StickyMobileShare";

// TEMPORARY STUB - full content being restored
export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <Layout>
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Loading article…</p>
        <p className="text-xs mt-2">{slug}</p>
      </div>
    </Layout>
  );
}
