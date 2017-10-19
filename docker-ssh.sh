#!/usr/bin/env bash
# http://superuser.com/questions/232373/how-to-tell-git-which-private-key-to-use/920849#920849
ssh -i /usr/src/app/docker-ssh \
  -o UserKnownHostsFile=/dev/null \
  -o StrictHostKeyChecking=no \
  $*
