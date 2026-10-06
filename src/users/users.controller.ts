import { Body, Controller, Get, Post, Patch, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get()
  findAll() {
    return this.usersService.getAllUsers();
  }

  @Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateUserDto,
) {
  return this.usersService.updateUser(id, dto);
}

@Delete(':id')
remove(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.deleteUser(id);
}
}
