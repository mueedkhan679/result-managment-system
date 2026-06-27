export function gradeForPercentage(p){
  if (p>=90) return 'A+'
  if (p>=80) return 'A'
  if (p>=70) return 'B'
  if (p>=60) return 'C'
  if (p>=50) return 'D'
  if (p>=40) return 'E'
  return 'F'
}
