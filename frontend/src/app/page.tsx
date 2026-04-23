import { Container, Title, Text, Button, Stack } from '@mantine/core'

export default function HomePage() {
  return (
    <Container size="lg" py="xl">
      <Stack align="center" gap="xl">
        <Title order={1}>바이올린 학원에 오신 것을 환영합니다</Title>
        <Text size="lg" c="dimmed">
          음악으로 함께하는 특별한 여정
        </Text>
        <Button size="lg">학원 소개 보기</Button>
      </Stack>
    </Container>
  )
}
