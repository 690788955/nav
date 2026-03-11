# GitLab Runner 配置与本地镜像产物说明

本文档说明两件事：

1. 如何为本项目配置可用的 GitLab Runner
2. 当前 `.gitlab-ci.yml` 如何在 **不接入镜像仓库** 的情况下构建并保存 Docker 镜像

> 当前 GitLab CI 不会把镜像推送到远程仓库，而是把构建好的镜像导出为流水线产物（artifact）供你手动下载和加载。

---

## 一、当前工作流做了什么

GitLab CI 文件：`/.gitlab-ci.yml`

当前行为：

- 仅在推送版本 tag 时触发，例如：`v1.0.0`
- 使用 Docker in Docker（`docker:dind`）构建镜像
- 构建参数固定为：`PRISMA_PROVIDER=postgresql`
- 构建完成后生成以下产物：
  - `nav-v1.0.0.tar.gz`
  - `nav-v1.0.0.tar.gz.sha256`

你可以在 GitLab Job 页面下载这个 artifact，然后在服务器或本地机器手动导入。

---

## 二、推荐 Runner 方案

建议使用：

- **GitLab Runner**
- **Docker executor**
- **privileged = true**

原因很简单：当前流水线依赖 `docker:dind`，如果没有 `privileged`，容器内 Docker 守护进程通常无法正常工作。

---

## 三、Runner 所在机器要求

推荐环境：

- Linux 服务器（Ubuntu / Debian 最常见）
- 已安装 Docker Engine
- 能访问你的 GitLab 实例
- 机器磁盘空间充足（Docker 构建会占用较多缓存）

建议最低准备：

- 2 CPU
- 4 GB RAM
- 20 GB 可用磁盘

如果你的镜像构建频繁，建议给更多磁盘空间。

---

## 四、安装 GitLab Runner

以下示例基于 Ubuntu / Debian。

### 1）安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker
docker version
```

### 2）安装 GitLab Runner

```bash
curl -L --output gitlab-runner.deb "https://gitlab-runner-downloads.s3.amazonaws.com/latest/deb/gitlab-runner_amd64.deb"
sudo dpkg -i gitlab-runner.deb
gitlab-runner --version
```

---

## 五、注册 Runner

先到 GitLab 项目页面获取注册信息：

- `Settings` → `CI/CD`
- 展开 `Runners`
- 创建或查看可用 Runner

然后在服务器执行：

```bash
sudo gitlab-runner register
```

建议填写方式如下：

- GitLab URL：你的 GitLab 地址
- Token：项目提供的 runner token
- Description：`nav-docker-runner`
- Tags：`nav,docker`
- Executor：`docker`
- Default Docker image：`docker:27.4.1-cli`

---

## 六、关键配置：开启 privileged

注册完成后，编辑 Runner 配置文件：

```bash
sudo vim /etc/gitlab-runner/config.toml
```

把对应 runner 配成类似下面这样：

```toml
[[runners]]
  name = "nav-docker-runner"
  url = "https://gitlab.example.com"
  token = "YOUR_RUNNER_TOKEN"
  executor = "docker"

  [runners.docker]
    tls_verify = false
    image = "docker:27.4.1-cli"
    privileged = true
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/cache"]
    shm_size = 0
```

最重要的是这项：

```toml
privileged = true
```

没有它，当前 `docker:dind` 工作流大概率无法正常构建镜像。

修改完成后重启 Runner：

```bash
sudo gitlab-runner restart
sudo gitlab-runner verify
```

---

## 七、项目侧如何匹配这个 Runner

如果你的 GitLab Runner 是**共享 Runner**，通常不需要额外配置。

如果你使用的是**指定标签 Runner**，建议在 `.gitlab-ci.yml` 的 job 中增加：

```yaml
tags:
  - nav
  - docker
```

只有当你的 Runner 注册时也带了同样的 tag，这个 job 才会被它接走。

如果你只有一个专用 Runner，也可以先不加 tag。

---

## 八、如何触发构建

当前流水线只认版本 tag：

```bash
git tag v1.0.0
git push origin v1.0.0
```

只要 tag 符合下面这个格式就会触发：

```text
v数字.数字.数字
```

例如：

- `v1.0.0` ✅
- `v2.3.4` ✅
- `1.0.0` ❌
- `release-1.0.0` ❌

---

## 九、构建完成后如何取出镜像

流水线成功后，到 GitLab 的对应 Job 页面下载 artifact。

你会拿到：

- `nav-v1.0.0.tar.gz`
- `nav-v1.0.0.tar.gz.sha256`

### 1）校验文件完整性

Linux/macOS：

```bash
sha256sum -c nav-v1.0.0.tar.gz.sha256
```

如果你在 Windows PowerShell：

```powershell
Get-FileHash .\nav-v1.0.0.tar.gz -Algorithm SHA256
```

### 2）导入 Docker 镜像

Linux/macOS：

```bash
gunzip -c nav-v1.0.0.tar.gz | docker load
```

如果你的环境没有 `gunzip`，也可以先解压后导入：

```bash
gzip -d nav-v1.0.0.tar.gz
docker load -i nav-v1.0.0.tar
```

导入成功后，检查镜像：

```bash
docker images | grep nav
```

---

## 十、如何在服务器上使用这个本地镜像

如果你下载 artifact 到部署机，并且已经执行了 `docker load`，就可以直接用本地镜像启动。

例如：

```bash
docker run -d \
  --name nav \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://nav:password@postgresql:5432/nav" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://your-domain:3000" \
  nav:v1.0.0
```

如果你想继续使用 `docker-compose.yml`，则需要把其中的 `image:` 改成你本地已加载的标签，例如：

```yaml
image: nav:v1.0.0
```

否则 compose 仍然会尝试去拉远程镜像。

---

## 十一、常见问题

### 1）为什么 job 一直卡在 pending？

通常是以下原因之一：

- 没有可用 Runner
- Runner 没有启用当前项目
- job 配了 tag，但 Runner 没有对应 tag

### 2）为什么 `docker info` 失败？

通常说明：

- Runner 不是 Docker executor
- 没开 `privileged = true`
- `docker:dind` 没正常启动

### 3）为什么没有推送到镜像仓库？

这是当前设计决定。

你现在明确说了“没有镜像仓库，先存本地”，所以流水线只做：

- build
- save
- artifact upload

后面如果你有了 GitLab Container Registry、Harbor、Docker Hub 或私有 registry，再把 `.gitlab-ci.yml` 改成 push 即可。

### 4）artifact 过期了怎么办？

当前 `.gitlab-ci.yml` 里设置的是：

```yaml
expire_in: 7 days
```

如果你希望保留更久，可以自行改大。

---

## 十二、后续可选增强

后续如果你需要，我建议再加这几项：

1. `main` 分支自动构建一次测试镜像
2. `lint` / `build` 预检查阶段
3. 自动上传到正式镜像仓库（Harbor / Docker Hub / GitLab Registry）
4. 自动部署到目标服务器

当前版本优先满足：

- Runner 容易配置
- 不依赖远程镜像仓库
- 能稳定产出可下载的 Docker 镜像
