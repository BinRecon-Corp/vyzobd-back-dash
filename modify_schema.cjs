const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(
  'model Customer {',
  `enum AuthProvider {
  LOCAL
  GOOGLE
  FACEBOOK
}

model Customer {`
);

schema = schema.replace(
  `  passwordHash         String?
  isVerified           Boolean   @default(false)`,
  `  passwordHash         String?
  avatarUrl            String?
  emailVerified        Boolean   @default(false)
  provider             AuthProvider @default(LOCAL)
  providerId           String?`
);

schema = schema.replace(
  `  addresses              CustomerAddress[]
  refreshTokens          CustomerRefreshToken[]`,
  `  addresses              CustomerAddress[]
  sessions               CustomerSession[]
  refreshTokens          CustomerRefreshToken[]`
);

schema = schema.replace(
  `  @@index([isVerified])`,
  `  @@index([emailVerified])`
);

const refreshTokenModelEnd = `  @@index([customerId])
  @@index([tokenHash])
}`;

schema = schema.replace(
  refreshTokenModelEnd,
  refreshTokenModelEnd + `

model CustomerSession {
  id           String   @id @default(uuid())
  customerId   String
  customer     Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  token        String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([customerId])
  @@index([token])
}`
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema modified successfully');
