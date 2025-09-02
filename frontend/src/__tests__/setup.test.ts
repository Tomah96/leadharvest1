describe('Test Setup', () => {
  it('should be able to run tests', () => {
    expect(true).toBe(true)
  })

  it('should have environment variables', () => {
    expect(process.env.NEXT_PUBLIC_API_URL).toBe('http://localhost:3001/api')
  })
})