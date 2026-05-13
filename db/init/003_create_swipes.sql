CREATE TABLE swipes (
    id SERIAL PRIMARY KEY,
    swiper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    swiped_id UUID REFERENCES users(id) ON DELETE CASCADE,
    direction BOOLEAN NOT NULL,  -- TRUE = like, FALSE = pass
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(swiper_id, swiped_id)  -- prevent duplicate swipe on same person
);

CREATE INDEX idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX idx_swipes_created ON swipes(created_at);
