import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 基础分类（少量）
const basicCategories = [
  { name: '常用工具', slug: 'tools', order: 1 },
  { name: '开发资源', slug: 'dev', order: 2 },
  { name: '设计灵感', slug: 'design', order: 3 },
  { name: '学习社区', slug: 'community', order: 4 },
]

// 预设标签（官方标签）
const presetTags = [
  { name: '设计', slug: 'design' },
  { name: '开发', slug: 'dev' },
  { name: 'AI', slug: 'ai' },
  { name: '效率工具', slug: 'productivity' },
  { name: '营销', slug: 'marketing' },
  { name: '数据分析', slug: 'analytics' },
  { name: '协作', slug: 'collaboration' },
  { name: '学习', slug: 'learning' },
  { name: '娱乐', slug: 'entertainment' },
  { name: '其他', slug: 'other' },
]

// 完整分类（大量）
const fullCategories = [
  { name: '常用工具', slug: 'tools', order: 1 },
  { name: '开发工具', slug: 'dev', order: 2 },
  { name: '设计资源', slug: 'design', order: 3 },
  { name: '学习资源', slug: 'learning', order: 4 },
  { name: 'AI 工具', slug: 'ai', order: 5 },
  { name: '云服务', slug: 'cloud', order: 6 },
  { name: '社区论坛', slug: 'community', order: 7 },
  { name: '文档参考', slug: 'docs', order: 8 },
  { name: '生产力', slug: 'productivity', order: 9 },
  { name: '娱乐休闲', slug: 'entertainment', order: 10 },
]

// 基础网站（少量示例）
const basicSites = [
  {
    name: 'Google',
    url: 'https://www.google.com',
    description: '全球最大的搜索引擎',
    categorySlug: 'tools',
    tags: '[]',
    platforms: '["Web"]',
    useCases: '搜索和信息查询',
  },
  {
    name: 'GitHub',
    url: 'https://github.com',
    description: '全球最大的代码托管平台',
    categorySlug: 'dev',
    tags: '["开发"]',
    platforms: '["Web"]',
    useCases: '代码托管和协作开发',
  },
  {
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    description: '程序员问答社区',
    categorySlug: 'dev',
    tags: '["开发", "学习"]',
    platforms: '["Web"]',
    useCases: '技术问答和知识分享',
  },
  {
    name: 'Figma',
    url: 'https://www.figma.com',
    description: '在线协作设计工具',
    categorySlug: 'design',
    tags: '["设计", "协作"]',
    platforms: '["Web"]',
    useCases: '界面设计和原型制作',
  },
]

// 完整网站（大量示例）
const fullSites = [
  // 常用工具
  { name: 'Google', url: 'https://www.google.com', description: '全球最大的搜索引擎', categorySlug: 'tools', tags: '[]', platforms: '["Web"]', useCases: '搜索和信息查询' },
  { name: 'GitHub', url: 'https://github.com', description: '全球最大的代码托管平台', categorySlug: 'tools', tags: '["开发"]', platforms: '["Web"]', useCases: '代码托管和协作开发' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', description: '程序员问答社区', categorySlug: 'tools', tags: '["开发", "学习"]', platforms: '["Web"]', useCases: '技术问答和知识分享' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', description: 'OpenAI 的 AI 聊天机器人', categorySlug: 'tools', tags: '["AI"]', platforms: '["Web"]', useCases: 'AI 对话和内容生成' },
  { name: 'Notion', url: 'https://www.notion.so', description: '一体化工作空间', categorySlug: 'tools', tags: '["效率工具", "协作"]', platforms: '["Web", "Desktop"]', useCases: '笔记、数据库和项目管理' },

  // 开发工具
  { name: 'VS Code', url: 'https://code.visualstudio.com', description: '强大的代码编辑器', categorySlug: 'dev', tags: '["开发"]', platforms: '["Desktop"]', useCases: '代码编辑和开发' },
  { name: 'Vercel', url: 'https://vercel.com', description: 'Next.js 开发团队推出的部署平台', categorySlug: 'dev', tags: '["开发"]', platforms: '["Web"]', useCases: '应用部署和托管' },
  { name: 'React', url: 'https://react.dev', description: 'React 官方文档', categorySlug: 'dev', tags: '["开发", "学习"]', platforms: '["Web"]', useCases: 'React 框架学习' },
  { name: 'Next.js', url: 'https://nextjs.org', description: 'React 全栈框架', categorySlug: 'dev', tags: '["开发"]', platforms: '["Web"]', useCases: '全栈应用开发' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com', description: '实用优先的 CSS 框架', categorySlug: 'dev', tags: '["开发", "设计"]', platforms: '["Web"]', useCases: 'CSS 样式框架' },

  // 设计资源
  { name: 'Dribbble', url: 'https://dribbble.com', description: '设计师作品分享社区', categorySlug: 'design', tags: '["设计"]', platforms: '["Web"]', useCases: '设计灵感和作品展示' },
  { name: 'Behance', url: 'https://www.behance.net', description: 'Adobe 创意作品展示平台', categorySlug: 'design', tags: '["设计"]', platforms: '["Web"]', useCases: '创意作品展示' },
  { name: 'Figma', url: 'https://www.figma.com', description: '在线协作设计工具', categorySlug: 'design', tags: '["设计", "协作"]', platforms: '["Web"]', useCases: '界面设计和原型制作' },
  { name: 'shadcn/ui', url: 'https://ui.shadcn.com', description: '精美的 React 组件库', categorySlug: 'design', tags: '["设计", "开发"]', platforms: '["Web"]', useCases: 'UI 组件库' },
  { name: 'Unsplash', url: 'https://unsplash.com', description: '免费高质量图片资源', categorySlug: 'design', tags: '["设计"]', platforms: '["Web"]', useCases: '免费图片素材' },

  // 学习资源
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: 'Web 开发权威文档', categorySlug: 'learning', tags: '["开发", "学习"]', platforms: '["Web"]', useCases: 'Web 技术文档' },
  { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org', description: '免费编程学习平台', categorySlug: 'learning', tags: '["学习"]', platforms: '["Web"]', useCases: '免费编程教程' },
  { name: 'LeetCode', url: 'https://leetcode.cn', description: '算法刷题平台', categorySlug: 'learning', tags: '["学习"]', platforms: '["Web"]', useCases: '算法练习' },
  { name: 'Coursera', url: 'https://www.coursera.org', description: '在线课程学习平台', categorySlug: 'learning', tags: '["学习"]', platforms: '["Web"]', useCases: '在线课程学习' },
  { name: 'YouTube', url: 'https://www.youtube.com', description: '全球最大的视频分享平台', categorySlug: 'learning', tags: '["学习", "娱乐"]', platforms: '["Web"]', useCases: '视频学习和娱乐' },

  // AI 工具
  { name: 'Claude', url: 'https://claude.ai', description: 'Anthropic 推出的 AI 助手', categorySlug: 'ai', tags: '["AI"]', platforms: '["Web"]', useCases: 'AI 对话和分析' },
  { name: 'Midjourney', url: 'https://www.midjourney.com', description: 'AI 图像生成工具', categorySlug: 'ai', tags: '["AI", "设计"]', platforms: '["Web"]', useCases: 'AI 图像生成' },
  { name: 'Hugging Face', url: 'https://huggingface.co', description: 'AI 模型社区', categorySlug: 'ai', tags: '["AI", "开发"]', platforms: '["Web"]', useCases: 'AI 模型库' },
  { name: 'Perplexity', url: 'https://www.perplexity.ai', description: 'AI 搜索引擎', categorySlug: 'ai', tags: '["AI"]', platforms: '["Web"]', useCases: 'AI 搜索' },
  { name: 'Runway', url: 'https://runwayml.com', description: 'AI 视频编辑工具', categorySlug: 'ai', tags: '["AI"]', platforms: '["Web"]', useCases: 'AI 视频编辑' },

  // 云服务
  { name: 'AWS', url: 'https://aws.amazon.com', description: '亚马逊云服务平台', categorySlug: 'cloud', tags: '["开发"]', platforms: '["Web"]', useCases: '云计算服务' },
  { name: 'Cloudflare', url: 'https://www.cloudflare.com', description: 'CDN 和网络安全服务', categorySlug: 'cloud', tags: '["开发"]', platforms: '["Web"]', useCases: 'CDN 和安全' },
  { name: 'Railway', url: 'https://railway.app', description: '简单易用的云平台', categorySlug: 'cloud', tags: '["开发"]', platforms: '["Web"]', useCases: '应用部署' },
  { name: 'Netlify', url: 'https://www.netlify.com', description: '现代化的部署平台', categorySlug: 'cloud', tags: '["开发"]', platforms: '["Web"]', useCases: '静态网站部署' },

  // 社区论坛
  { name: 'Twitter', url: 'https://twitter.com', description: '实时社交网络平台', categorySlug: 'community', tags: '["协作"]', platforms: '["Web"]', useCases: '社交分享' },
  { name: 'Reddit', url: 'https://www.reddit.com', description: '社交新闻聚合网站', categorySlug: 'community', tags: '["协作"]', platforms: '["Web"]', useCases: '社区讨论' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', description: '计算机新闻社区', categorySlug: 'community', tags: '["开发"]', platforms: '["Web"]', useCases: '技术新闻' },
  { name: 'Product Hunt', url: 'https://www.producthunt.com', description: '产品发现社区', categorySlug: 'community', tags: '["营销"]', platforms: '["Web"]', useCases: '产品发现' },
  { name: 'Indie Hackers', url: 'https://www.indiehackers.com', description: '独立开发者社区', categorySlug: 'community', tags: '["开发"]', platforms: '["Web"]', useCases: '创业社区' },

  // 文档参考
  { name: 'Can I Use', url: 'https://caniuse.com', description: '浏览器兼容性查询', categorySlug: 'docs', tags: '["开发"]', platforms: '["Web"]', useCases: '浏览器兼容性查询' },
  { name: 'DevDocs', url: 'https://devdocs.io', description: '多语言文档集合', categorySlug: 'docs', tags: '["开发"]', platforms: '["Web"]', useCases: '技术文档' },
  { name: 'CSS-Tricks', url: 'https://css-tricks.com', description: 'CSS 技巧和教程', categorySlug: 'docs', tags: '["开发"]', platforms: '["Web"]', useCases: 'CSS 教程' },
  { name: 'RegExp101', url: 'https://regex101.com', description: '正则表达式在线测试', categorySlug: 'docs', tags: '["开发"]', platforms: '["Web"]', useCases: '正则表达式测试' },
  { name: 'JSON Editor', url: 'https://jsoneditoronline.org', description: 'JSON 在线编辑器', categorySlug: 'docs', tags: '["开发"]', platforms: '["Web"]', useCases: 'JSON 编辑' },

  // 生产力
  { name: 'Trello', url: 'https://trello.com', description: '项目管理工具', categorySlug: 'productivity', tags: '["效率工具", "协作"]', platforms: '["Web"]', useCases: '项目管理' },
  { name: 'Slack', url: 'https://slack.com', description: '团队协作工具', categorySlug: 'productivity', tags: '["协作"]', platforms: '["Web", "Desktop"]', useCases: '团队沟通' },
  { name: 'Miro', url: 'https://miro.com', description: '在线白板协作工具', categorySlug: 'productivity', tags: '["协作", "设计"]', platforms: '["Web"]', useCases: '在线协作' },
  { name: 'Zoom', url: 'https://zoom.us', description: '视频会议工具', categorySlug: 'productivity', tags: '["协作"]', platforms: '["Web", "Desktop"]', useCases: '视频会议' },
  { name: 'Discord', url: 'https://discord.com', description: '游戏社区和语音聊天', categorySlug: 'productivity', tags: '["协作"]', platforms: '["Web", "Desktop"]', useCases: '社区和语音' },

  // 娱乐休闲
  { name: 'Netflix', url: 'https://www.netflix.com', description: '流媒体视频服务', categorySlug: 'entertainment', tags: '["娱乐"]', platforms: '["Web"]', useCases: '视频流媒体' },
  { name: 'Spotify', url: 'https://www.spotify.com', description: '音乐流媒体服务', categorySlug: 'entertainment', tags: '["娱乐"]', platforms: '["Web"]', useCases: '音乐流媒体' },
  { name: 'Twitch', url: 'https://www.twitch.tv', description: '游戏直播平台', categorySlug: 'entertainment', tags: '["娱乐"]', platforms: '["Web"]', useCases: '游戏直播' },
  { name: 'Bilibili', url: 'https://www.bilibili.com', description: '国内知名视频弹幕网站', categorySlug: 'entertainment', tags: '["娱乐"]', platforms: '["Web"]', useCases: '视频弹幕' },
]

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'basic'

  console.log('\n🌱 开始填充种子数据...\n')

  // 检查是否已初始化
  const userCount = await prisma.user.count()
  const settingsExists = await prisma.systemSettings.count()
  const categoryCount = await prisma.category.count()

  const isInitialized = userCount > 0 || settingsExists > 0 || categoryCount > 0

  if (isInitialized && mode === 'init') {
    console.log('✅ 数据库已经初始化，跳过基础数据填充')
    console.log(`   - 用户: ${userCount}`)
    console.log(`   - 系统设置: ${settingsExists}`)
    console.log(`   - 分类: ${categoryCount}\n`)

    // 仅确保默认管理员存在
    if (userCount === 0) {
      console.log('⚠️  未检测到管理员用户，创建默认管理员...')
      await createDefaultAdmin()
    }

    return
  }

  // 1. 创建默认管理员用户
  if (userCount === 0) {
    await createDefaultAdmin()
  } else {
    console.log('✅ 管理员用户已存在，跳过\n')
  }

  // 2. 创建系统设置
  if (settingsExists === 0) {
    console.log('⚙️  创建系统设置...')
    await prisma.systemSettings.create({
      data: {
        id: 'default',
        siteName: 'Conan Nav',
        siteDescription: '简洁现代化的网址导航系统',
        pageSize: 20,
        showFooter: true,
        footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
        footerLinks: JSON.stringify([{ name: 'GitHub', url: 'https://github.com/kenanlabs/nav' }]),
        showAdminLink: true,
        enableVisitTracking: true,
        githubUrl: 'https://github.com/kenanlabs/nav',
      },
    })
    console.log('  ✓ 系统设置已初始化')
    console.log('  ✓ 友情链接: GitHub\n')
  } else {
    console.log('✅ 系统设置已存在，跳过\n')
  }

  // 3. 根据模式选择数据
  const categories = mode === 'full' ? fullCategories : basicCategories
  const sites = mode === 'full' ? fullSites : basicSites

  // 4. 创建预设标签
  console.log('🏷️  创建预设标签...')
  const createdTags = []

  for (const tag of presetTags) {
    const existing = await prisma.tag.findUnique({
      where: { slug: tag.slug },
    })

    if (!existing) {
      const created = await prisma.tag.create({
        data: {
          name: tag.name,
          slug: tag.slug,
          isOfficial: true,
          isApproved: true,
        },
      })
      createdTags.push(created)
      console.log(`  ✓ 创建标签: ${created.name}`)
    } else {
      createdTags.push(existing)
      console.log(`  - 标签已存在: ${existing.name}`)
    }
  }

  console.log(`\n📂 标签总数: ${createdTags.length}\n`)

  // 5. 创建分类
  console.log(`📁 创建分类 (${mode === 'full' ? '完整模式' : '基础模式'})...`)
  const createdCategories = []

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    })

    if (!existing) {
      const created = await prisma.category.create({
        data: category,
      })
      createdCategories.push(created)
      console.log(`  ✓ 创建分类: ${created.name}`)
    } else {
      createdCategories.push(existing)
      console.log(`  - 分类已存在: ${existing.name}`)
    }
  }

  console.log(`\n📂 分类总数: ${createdCategories.length}\n`)

  // 5. 创建网站
  console.log('🔗 创建网站...')
  let createdCount = 0
  let skippedCount = 0

  for (const site of sites) {
    const category = createdCategories.find((c) => c.slug === site.categorySlug)
    if (!category) {
      console.log(`  ✗ 未找到分类: ${site.categorySlug}`)
      continue
    }

    const existing = await prisma.site.findFirst({
      where: { url: site.url },
    })

    if (!existing) {
      await prisma.site.create({
        data: {
          name: site.name,
          url: site.url,
          description: site.description,
          categoryId: category.id,
          isPublished: true,
          tags: site.tags || '[]',
          platforms: site.platforms || '[]',
          useCases: site.useCases,
        },
      })
      createdCount++
      if (createdCount % 10 === 0 && mode === 'full') {
        console.log(`  进度: 已创建 ${createdCount} 个网站...`)
      }
    } else {
      skippedCount++
    }
  }

  console.log(`\n✅ 种子数据填充完成！`)
  console.log(`   - 模式: ${mode === 'full' ? '完整模式 (50+ 网站)' : '基础模式 (4 个示例网站)'}`)
  console.log(`   - 分类: ${createdCategories.length} 个`)
  console.log(`   - 新增网站: ${createdCount} 个`)
  console.log(`   - 已存在网站: ${skippedCount} 个\n`)

  console.log('💡 提示：')
  console.log('   - 管理员账号: admin@example.com')
  console.log('   - 管理员密码: admin123')
  console.log('   - 后台地址: /admin')
  if (mode === 'basic') {
    console.log('   - 如需更多示例数据，运行: npm run db:seed:full\n')
  }
}

async function createDefaultAdmin() {
  console.log('👤 创建管理员用户...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: '管理员',
      avatar: null, // 默认无头像，用户可在后台设置
      role: 'ADMIN',
    },
  })
  console.log('  ✓ 创建管理员: admin@example.com (密码: admin123)\n')
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
