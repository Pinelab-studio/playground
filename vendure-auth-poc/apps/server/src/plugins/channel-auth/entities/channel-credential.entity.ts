import { DeepPartial } from '@vendure/common/lib/shared-types';
import { VendureEntity, User, Channel, EntityId, ID, ChannelAware } from '@vendure/core';
import { Column, Entity, ManyToOne, ManyToMany, JoinTable } from 'typeorm';

@Entity()
export class ChannelCredential extends VendureEntity implements ChannelAware {
    constructor(input?: DeepPartial<ChannelCredential>) {
        super(input);
    }

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @EntityId()
    userId: ID;

    @Column()
    passwordHash: string;

    @Column({ nullable: true, type: 'varchar' })
    verificationToken: string | null;

    @Column({ nullable: true, type: 'varchar' })
    passwordResetToken: string | null;

    @Column({ default: false })
    verified: boolean;

    @ManyToMany(() => Channel)
    @JoinTable()
    channels: Channel[];
}
