# Netlify 서브모듈 오류 해결 가이드

## 문제

Netlify 배포 시 다음 오류 발생:
```
Error checking out submodules: fatal: No url found for submodule path 'Desktop/application/005-Developerpaper/developer-portfolio' in .gitmodules
```

## 원인

Git 저장소의 상위 디렉토리에 서브모듈이 잘못 설정되어 있거나, `.gitmodules` 파일이 없는데 서브모듈로 인식되는 경우입니다.

## 해결 방법

### 방법 1: Netlify 빌드 설정에서 서브모듈 비활성화 (권장)

Netlify 대시보드에서:
1. **Site settings** > **Build & deploy**
2. **Build settings** 섹션
3. **Advanced build settings** 클릭
4. **Submodules** 옵션을 **"None"** 또는 **"Disable"**로 설정

### 방법 2: Git에서 서브모듈 제거

```bash
# 1. 서브모듈 디렉토리 제거 (Git에서만)
cd /Users/donghakim
git rm --cached "Desktop/application/005-Developerpaper/developer-portfolio"

# 2. .gitmodules 파일 확인 및 수정
# 서브모듈 관련 항목 제거

# 3. .gitignore에 추가
echo "Desktop/" >> .gitignore

# 4. 커밋
git add .gitignore
git commit -m "Remove problematic submodule"
git push origin main
```

### 방법 3: netlify.toml에 서브모듈 비활성화 설정 추가

`netlify.toml` 파일이 이미 업데이트되었습니다. 추가 설정이 필요하면:

```toml
[build]
  command = "npm run build"
  publish = ".next"
  # 서브모듈 체크아웃 비활성화는 Netlify 대시보드에서 설정
```

## 빠른 해결 (Netlify 대시보드)

1. **Netlify 대시보드 접속**
   - https://app.netlify.com
   - 사이트 선택

2. **Build 설정 변경**
   - Site settings > Build & deploy
   - Build settings 섹션
   - "Edit settings" 클릭
   - **Submodules** 옵션 찾기
   - **"None"** 또는 **"Disable"** 선택
   - 저장

3. **재배포**
   - "Trigger deploy" > "Clear cache and deploy site"
   - 또는 GitHub에 푸시하여 자동 재배포

## 확인

배포 로그에서 다음 메시지가 사라지면 성공:
- ✅ "Error checking out submodules" 오류 없음
- ✅ 빌드가 정상적으로 시작됨

## 예방

앞으로 서브모듈 문제를 방지하려면:

1. **프로젝트별 Git 저장소 사용**
   - 각 프로젝트를 별도 저장소로 관리
   - 상위 디렉토리에 Git 저장소 만들지 않기

2. **.gitignore 설정**
   - 불필요한 디렉토리 제외
   - `Desktop/`, `Documents/` 등 제외

3. **Netlify 설정**
   - 서브모듈 체크아웃 비활성화

## 참고

- [Netlify Build Settings](https://docs.netlify.com/configure-builds/overview/)
- [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)




